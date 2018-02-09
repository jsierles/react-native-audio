package com.rnim.rn.audio;

import java.lang.System;
import java.lang.Thread;

public class StopWatch {
    private long start;
    private float elapsedTime = 0;
    private boolean paused = true;
  
    public StopWatch() {
    }
  
    public void start() {
        start = System.currentTimeMillis();
        paused = false;
    }
  
    public float stop() {
        if (!paused) {
            long now = System.currentTimeMillis();
            elapsedTime += (now - start) / 1000f;
            paused = true;
        }
  
        return elapsedTime;
    }
  
    public void reset() {
        start = 0;
        elapsedTime = 0;
        paused = true;
    }
  
    public float getTimeSeconds() {
      float seconds;
      
      if (paused) {
        seconds = elapsedTime;
      } else {
        long now = System.currentTimeMillis();
        seconds = elapsedTime + (now - start) / 1000f;
      }
        return seconds;
    }
  }